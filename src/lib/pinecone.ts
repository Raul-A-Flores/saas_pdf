import { Pinecone , PineconeRecord } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import {Document, RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter'
import { getEmbeddings } from './embeddings';
import md5 from 'md5'
import { convertToAscii } from './utils';
import { randomInt } from 'crypto';

export const getPineconeClient = () => {
    return new Pinecone({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  };


  type PDFPage = {
    pageContent: string;
    metadata: {
      loc: { pageNumber: number};
      key: string;
    };
  };




export async function loadS3IntoPinecone(fileKey: string){
  
  const file_name = await downloadFromS3(fileKey);
  console.log(fileKey)
  console.log("downloading s3 into file system")
if(!file_name){
    throw new Error('could not download from s3')
}
 const loader = new PDFLoader(file_name);
 const pages = (await loader.load()) as PDFPage[];
 // console.log(pages)
  const documents = await Promise.all(pages.map(prepareDocument))


  // Vectorize and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument))

  // upload to pinecone

  const client = await getPineconeClient()
  const pineconeIndex = client.Index('chatpdf')

  console.log('inserting vectors into pinecone')


  await pineconeIndex.upsert(vectors);


  /* const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  await namespace.upsert(vectors); */
  return documents[0];
}

  // Vectorizing and embedding documents 

async function embedDocument(doc:Document){
  
    try {
    const embeddings = await getEmbeddings(doc.pageContent)
    const hash = md5(doc.pageContent)

    return{
        id: hash, 
        values: embeddings, 
        metadata: {
          text:doc.metadata.text,
          pageNumber: doc.metadata.pageNumber,
          key: " "
          
        }
    } as PineconeRecord ;
    
  } catch (error) {
    console.log('error embedding document', error)
    throw error
  }
}




export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder()
  return new TextDecoder('utf-8').decode(enc.encode(str).slice(0,bytes))
}



async function prepareDocument(page: PDFPage){

    let {pageContent, metadata } = page;
    const hash = randomInt(0,2000)

    pageContent = pageContent.replace(/\n/g, '') 
    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
      new Document({
        pageContent, 
        metadata: {
          pageNumber: metadata.loc.pageNumber,
          text: truncateStringByBytes(pageContent, 36000),
          key: ''
        }
      })
    ])

    return docs
}