import { FC } from 'react';

export interface VideoCallRoomProps {
  chatStatus?: 'active' | 'inactive' | 'closed';
  roomUrl?: string;
  token?: string;
  userName?: string;
  userRole?: 'cliente' | 'profesional';
  titleId?: string;
  onCloseCall?: () => void;
}

export interface CallLauncherButtonProps {
  chatStatus?: string;
  onStartCall?: () => void;
}

declare const VideoCallRoom: FC<VideoCallRoomProps>;
export default VideoCallRoom;

export const CallLauncherButton: FC<CallLauncherButtonProps>;
