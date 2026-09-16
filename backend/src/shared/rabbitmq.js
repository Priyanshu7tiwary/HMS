import amqp from "amqplib"
import {cfg} from "../../index.js"



let connection;
let channel;

async function getChannel() {
  if (channel) return channel;

  connection = await amqp.connect(cfg.RABBIT_MQ_URI);
  channel = await connection.createChannel();

  process.on("SIGINT", async () => {
    await channel.close();
    await connection.close();
    process.exit(0);
  });

  return channel;
}


async function sendToQueue(queue, msg){

    if(!queue || !`${queue}`.trim()){
        throw new Error("send to queue err: Queue name is required!")
    }
    const q = `${queue}`.trim()
    try {
        
        const ch = await getChannel()
        
        await ch.assertQueue(q, {
          durable: true
        });

        // console.log("assertRes: ", assertRes)
    
        const isSent = ch.sendToQueue(q, Buffer.from(msg), { persistent: true })
        if (!isSent) {
            throw new Error("Message buffer full");
        }
        console.log(`msg: ${msg} sent to ${q} at ${Date.now()/1000}`)
    } catch (error) {
        console.error(`${q} queue sending err: `)
        throw error
    }
}

async function listenToQueue(queue, onMessage){
    if(!queue || !`${queue}`.trim()){
        throw new Error("send to queue err: Queue name is required!")
    }
    const q = `${queue}`.trim()
    try {
        const ch = await getChannel()

        await ch.assertQueue(q, {
          durable: true
        });

        ch.prefetch(1);

        // console.log("assertRes: ", assertRes)
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        ch.consume(q, async (msg) => {
            if (!msg) return;

            try {
                await onMessage(msg);
                ch.ack(msg);
            } catch (err) {
                console.error("Message processing failed:", err);
                ch.nack(msg, false, true); // requeue
            }
        });
    } catch (error) {
        console.error(`${q} queue recieving err: `)
        throw error
    }
}

const queueController = {
    sendToQueue,
    listenToQueue,
}

export default queueController