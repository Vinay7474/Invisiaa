import './App.css';
import Card from './card';
import HamburgerMenu from './Burger';
import { TypeAnimation } from 'react-type-animation';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('/create');
    };
    
    const handleJoin = () => {
        navigate('/join');
    };
    return (
        <>
            <header className="bg-purple-400 flex items-center justify-between px-8 py-4 h-20 relative">
                <div className="flex items-center space-x-4">
                    <img src="./upscalemedia-transformed.png" alt="Invisiaa Logo" className="w-14 h-14 m-0 hover:opacity-10 duration-300" />
                    <h1 className="text-4xl font-bold text-white hover:text-white/15 duration-300">Invisiaa</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="bg-body min-h-screen">
                
                <div className="py-10 font-bold">
                    <TypeAnimation
                        sequence={[
                            'Welcome to Invisiaa',
                            1500,
                            '',
                            500,
                            'Your invisible chat starts here...',
                            1500,
                        ]}
                        wrapper="h2"
                        cursor={true}
                        repeat={Infinity}
                        className="text-3xl font-semibold text-center text-purple-600"
                    />
                </div>


                <section className="text-center px-8 py-1 text-gray-800">
                    <p className="text-lg leading-relaxed max-w-3xl mx-auto">
                        <span className="font-semibold text-purple-950">Invisiaa</span> is a secure, session-based chat platform designed for privacy-focused conversations.
                        All messages are completely ephemeral — once the session ends, your chat history vanishes for good.
                        Whether you're coordinating sensitive plans or just having a private group discussion, Invisiaa makes sure your words leave no trace.
                    </p>
                    <p className="mt-4 text-md text-purple-900 italic">
                        Start or join a temporary chat session with QR-code access and security questions. It's private. It's simple. It's invisible.
                    </p>
                </section>


                <div className="flex justify-center items-center h-7xl">
                    <Card onClick={handleClick}
                        name="Create Session"
                        note="Note: maximum people can be allowed at most 10 MEMBERS!"
                        steps={[
                            " Click this button",
                            " Enter the number of participants",
                            " Enter the security question",
                            " Enter answer for it",
                            " Click Generate QR",
                            " Send the QR to the participants"
                        ]}
                    />
                    <Card
                    onClick={handleJoin}
                        name="Join Session"
                        note="Note: please make sure that you scan the QR CODE only once because it is sensitive!"
                        steps={[
                            " Click this button",
                            " Enter the QR CODE",
                            " Answer the security question",
                            " Start chatting"
                        ]}
                    />
                </div>
            </main>
        </>
    );
}
