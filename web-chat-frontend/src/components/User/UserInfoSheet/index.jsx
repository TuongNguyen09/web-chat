import React from 'react';
import UserInfoMain from './UserInfoMain';
import ChatMediaSection from '../../Group/GroupInfoSheet/ChatMediaSection';
import ChatMessageSearchSection from '../../Group/GroupInfoSheet/ChatMessageSearchSection';

const UserInfoSheet = (props) => {
    const { open, chat, messages = [], onClose, onRequestJumpToMessage } = props;
    if (!open || !chat) return null;

    // render suppressed in production; remove noisy console.log

    const handleSelectMessage = (messageId) => {
        if (!messageId) return;
        onRequestJumpToMessage?.(messageId);
        onClose?.();
    };

    return (
           <UserInfoMain {...props}>
             <UserInfoMain.Details />
             <ChatMessageSearchSection messages={messages} onSelectMessage={handleSelectMessage} />
             <ChatMediaSection messages={messages} />
        </UserInfoMain>
    );
};
export default UserInfoSheet;