import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import UserInfoMain from './UserInfoMain';
import ChatMediaSection from '../../Group/GroupInfoSheet/ChatMediaSection';
import ChatMessageSearchSection from '../../Group/GroupInfoSheet/ChatMessageSearchSection';
import { checkBlockStatus } from '../../../redux/chat/action';
import { getChatPartner } from '../../../utils/chatUtils';
import { logger } from '../../../utils/logger';

const UserInfoSheet = (props) => {
    const { open, chat, messages = [], onClose, onRequestJumpToMessage, currentUserId } = props;
    const dispatch = useDispatch();
    const [blockStatus, setBlockStatus] = useState({ isBlockedByUser: false, userBlockedByMe: false });

    // Fetch block status when sheet opens or chat changes
    useEffect(() => {
        if (!open || !chat) {
            setBlockStatus({ isBlockedByUser: false, userBlockedByMe: false });
            return;
        }

        const fetchBlockStatus = async () => {
            try {
                const partner = getChatPartner(chat, currentUserId);
                if (!partner) return;

                const status = await dispatch(checkBlockStatus({ userId: partner.id }));
                setBlockStatus(status || { isBlockedByUser: false, userBlockedByMe: false });
            } catch (error) {
                logger.error("Failed to check block status in UserInfoSheet", error);
                setBlockStatus({ isBlockedByUser: false, userBlockedByMe: false });
            }
        };

        fetchBlockStatus();
    }, [open, chat, currentUserId, dispatch]);

    if (!open || !chat) return null;

    // render suppressed in production; remove noisy console.log

    const handleSelectMessage = (messageId) => {
        if (!messageId) return;
        onRequestJumpToMessage?.(messageId);
        onClose?.();
    };

    return (
           <UserInfoMain {...props} blockStatus={blockStatus}>
             <UserInfoMain.Details />
             <ChatMessageSearchSection messages={messages} onSelectMessage={handleSelectMessage} />
             <ChatMediaSection messages={messages} />
        </UserInfoMain>
    );
};

export default UserInfoSheet;