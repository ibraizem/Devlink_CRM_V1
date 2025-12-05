import { StatusBadge, StatusVariant } from './StatusBadge'

interface LogEntryProps {
  message: string
  type?: StatusVariant
  timestamp?: Date
}

export function LogEntry({ message, type = 'info', timestamp = new Date() }: LogEntryProps) {
  const timeString = timestamp.toLocaleTimeString('fr-FR', { 
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Nettoyer le message en supprimant le timestamp s'il est présent
  const cleanMessage = message.replace(/^\d{2}:\d{2}:\d{2}:\s*/, '');
  
  // Déterminer les classes en fonction du type
  const getContainerClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'success':
        return 'bg-green-50 border-green-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-100';
      default:
        return 'bg-white border-gray-100';
    }
  };

  const getTextClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-gray-800';
    }
  };

  const getBadgeClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'error':
        return 'Erreur';
      case 'success':
        return 'Succès';
      case 'warning':
        return 'Avertissement';
      default:
        return 'Info';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getContainerClasses()}`}>
      <div className="flex">
        <div className="shrink-0">
          <StatusBadge variant={type}>
            {getTypeLabel()}
          </StatusBadge>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextClasses()}`}>
            {cleanMessage}
          </p>
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <span>{timeString}</span>
            {type !== 'info' && (
              <span className={`ml-2 px-2 py-0.5 rounded-full ${getBadgeClasses()}`}>
                {getTypeLabel()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
