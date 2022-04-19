const { on } = require('events')
const path = require('path')
const {Worker, isMainThread} = require('worker_threads')

const pathToResizeWorker = path.resolve(__dirname, 'resizeWorker.js')
const pathToMonochromeWorker = path.resolve(__dirname, 'monochromeWorker.js')

function uploadPathResolver(filename){
    return path.resolve(__dirname, '../uploads', filename)
}

function imageProcessor(filename){
    //console.log(filename);
    const sourcePath = uploadPathResolver(filename)
    //console.log(sourcePath);
    const resizedDestination = uploadPathResolver('resized-' + filename)
    //console.log(resizedDestination);
    const monochromeDestination = uploadPathResolver('monochrome-' + filename)
    var resizedWorkerFinished = false
    var monochromeWorkerFinished  = false

    return new Promise((resolve, reject)=>{
        if(isMainThread){
            try {

                const resizedWorker = new Worker(pathToResizeWorker, {
                    workerData: {
                        source: sourcePath,
                        destination: resizedDestination
                    }
                })

                const monochromeWorker = new Worker(pathToMonochromeWorker, {
                    workerData:{
                        source: sourcePath,
                        destination: monochromeDestination
                    }
                })

                resizedWorker.on('message', (message)=>{
                    resizedWorkerFinished = true
                    
                    if(monochromeWorkerFinished){
                       
                       // console.log("Mono Done");
                        resolve('resizeWorker finished processing')
                    }
                    
                })

                monochromeWorker.on('message', (message)=>{
                    monochromeWorkerFinished = true
                    if(resizedWorkerFinished){
                        //console.log("Resize Done");
                        resolve('monochromeWorker finished processing')
                    }
                    
                })
                resizedWorker.on('error', (error)=>{
                   
                    reject(new Error(error.message))
                })
                monochromeWorker.on('error', (error)=>{
                    reject(new Error(error.message))
                })

                resizedWorker.on('exit', (code)=>{
                    if(code !== 0){
                        //console.log('Exited with status code ' + code);
                        reject(new Error('Exited with status code ' + code))
                    }
                })
                monochromeWorker.on('exit', (code)=>{
                    if(code !== 0){
                        reject(new Error('Exited with status code ' + code))
                    }
                })

            } catch (error) {
                reject(error)
            }
        }
        else{
            reject(new Error('not on main thread'))
        }
        
    })
}

module.exports = imageProcessor