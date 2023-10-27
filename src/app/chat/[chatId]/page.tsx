import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import React from 'react'
import { eq } from 'drizzle-orm';
import ChatSideBar from '@/components/ChatSideBar';
import PDFViewer from '@/components/PDFViewer';

type Props = {

    params: {
        chatId: string;
    }
}

const ChatPage = async ({params: { chatId }}: Props) => {

    const {userId} = await auth()
    if (!userId) {
        return redirect('/sign-in')
}
    const _chats = await db.select().from(chats).where(eq(chats.userId, userId))
    if(!_chats){
        return redirect('/')
    }

    if(!_chats.find(chat=>chat.id === parseInt(chatId))){
        return redirect('/')
    }


    const currentChat = _chats.find(chat => chat.id ===parseInt(chatId))
  return (
    <div className='flex max-h-screen overflow-scroll'>
        <div className='flex w-full max-h-screen overflow-scroll'>
            <div className='flex-[1] max-w-xs'>
                <ChatSideBar chats={_chats} chatId={parseInt(chatId)}/>
            </div>
            <div className='mex-h-screen p-4 overflow-scroll flex-[5]'>
                <PDFViewer pdf_url={currentChat?.pdfUrl || '' }/>
            </div>
            <div className='flex-[3] border-1-4 border-1-slate-200'>
            </div>

        </div>
    </div>
  )
}

export default ChatPage;