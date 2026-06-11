const mqtt= require('mqtt');

const connectMqtt=process.env.MQTT_URI;
const username=process.env.MQTT_BROKER_USERNAME;
const password=process.env.MQTT_BROKER_PASSWORD;
const topic=process.env.TOPIC;
// const broker = process.env.MQTT_BROKER;  // <- VM ka IP
// const port = process.env.MQTT_PORT;
// const client = mqtt.connect(`mqtt://${broker}:${port}`);

console.log(connectMqtt,"bcjbdj");
const client=mqtt.connect(connectMqtt,{
   username:username,
   password:password
});


client.on('connect',(message)=>{
    console.log('Connceted to MQTT broker Successfully');
    // client.subscribe([topic],()=>{
    //     console.log(`Subscribed to topic: ${topic}`);
    // })
})

client.on('message',(topic,message)=>{
    console.log(`Received message from topic ${topic}: ${message.toString()}`);
})

exports.publishData=(data)=>{

    const typeOption={
        train:{qos:1,retain:true},
        camera:{qos:0, retain:true}
    }

     const options = typeOption[data.type] || { qos: 0, retain: false };

    client.publish(topic, JSON.stringify
        (data),options,(err)=>{

            if(err){
                console.error('Error publishing data:',err);
            }
            console.log(`Data Publish ${data.type} to topic ${topic}`);

        }
    )
}