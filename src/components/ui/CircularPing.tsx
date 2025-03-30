import React from 'react'
import { Spinner } from './kibo-ui/spinner'
import { SpinningText } from './magicui/spinning-text'

const CircularPing = () => {
    return (
        <div className='bg-white rounded-full p-10 relative flex justify-center items-center'>
            <Spinner key={"ring"} variant={"ring"} size={64} className='' />
            <SpinningText className="text-xs text-black font-light-regular uppercase absolute" duration={10} radius={7}>
                Identity. Web. Design
            </SpinningText>
        </div>
    )
}

export default CircularPing