// if a monitor is down then the notification is pushed into a queue
// push alert into alert_queue
// checking url status --> status == "up" --> create check in db
//                    `--> status == "down -> push in queue -> write to db -> pop from alert queue -> check for db record -> if not created, crete first -> send notification queues   
