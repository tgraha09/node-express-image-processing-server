const gm = require('gm')
const {workerData , parentPort } = require('worker_threads')

gm(workerData.source).monochrome().write(workerData.destination, (error)=>{
    parentPort.postMessage({
        monochrome: true
    })

    if(error){
        throw error
    }
})