import React, { useState } from 'react';
import { SignIn } from '../../components/Auth/SignIn';
import { SignUp } from '../../components/Auth/SignUp';
import { LeftPanel } from '../../components/Auth/LeftPanel';

export const Auth = () => {
    const [mode, setMode] = useState('signin');

    return (
        <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
            <div className="w-full max-w-5xl bg-white border border-[#e4e8ea] rounded-[32px] shadow-[0_35px_70px_rgba(15,23,42,0.08)] overflow-hidden md:h-[720px] md:min-h-[720px]">
                <div className="flex flex-col md:flex-row h-full">
                    <LeftPanel />

                    {/* RIGHT PANEL */}
                    <div className="w-full md:w-1/2 h-full bg-white">
                        <div className="h-full flex flex-col items-center px-8 sm:px-12 py-10 overflow-y-auto">
                            {mode === 'signin' ? (
                                <SignIn onSwitchMode={() => setMode('signup')} />
                            ) : (
                                <SignUp onSwitchMode={() => setMode('signin')} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};