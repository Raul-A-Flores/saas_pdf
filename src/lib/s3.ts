import AWS from 'aws-sdk';

export async function uploadToS3(file:File){
    try {
     
        console.log('**************************',file)
        const s3 = new AWS.S3({
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
              },

            region: 'us-west-1',
        })


        const file_key = 'uploads/' + Date.now().toString() + file.name.replace(' ', '-' )

        console.log(file_key)

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file

        }

        
        const upload = s3.putObject(params).on('httpUploadProgress', evt => {

            console.log('uploading to s3...', parseInt(((evt.loaded*100)/evt.total).toString())) +'%'

        }).promise()

        await upload.then((data) =>{
            console.log('successfully uploaded to S3!', file_key)
        })

        return Promise.resolve({
            file_key,
            file_name: file.name
        })
    } catch (error) {
        
    }
}


export function getS3Url(file_key: string){
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-west-1.amazonaws.com/${file_key}`
    return url;
}