import { toast } from "sonner";

export enum MessageType {
  Toast = "toast",
}

export enum MessageLevel {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

type Props = {
  type?: MessageType;
  level: MessageLevel;
  title: string | React.ReactNode;
  content?: string | React.ReactNode;
  onClose?: () => void;
  duration?: number;
};

const showMessage = ({
  type,
  level,
  title,
  content,
  onClose,
  duration,
}: Props) => {
  switch (type) {
    case MessageType.Toast:
      toast[level](content || title, {
        onAutoClose: onClose,
        closeButton: true,
      });
      break;
    default:
      toast[level](content || title, {
        onAutoClose: onClose,
        closeButton: true,
      });
      break;
  }
};

export default showMessage;
