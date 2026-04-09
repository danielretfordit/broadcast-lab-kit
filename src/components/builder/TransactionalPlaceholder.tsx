import { Construction } from 'lucide-react';

export default function TransactionalPlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-10 text-center">
      <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Construction size={48} className="text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Транзакционные рассылки
        </h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Модуль транзакционных рассылок находится в разработке. Здесь вы сможете настраивать
          автоматические уведомления по событиям: подтверждение заказа, статус доставки,
          смена пароля и другие триггерные сообщения.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning text-sm font-medium">
        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
        В разработке
      </div>
    </div>
  );
}
