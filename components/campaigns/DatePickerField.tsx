import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { format, differenceInCalendarDays, isToday, isTomorrow, isYesterday, addDays, getWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, X as XIcon, Info, Clock, AlertCircle, CheckCircle } from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Props<TFormValues extends FieldValues> = {
  control: Control<TFormValues>;
  name: Path<TFormValues>;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  showDuration?: boolean;
  showRelativeDate?: boolean;
  showDaysUntil?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  helperText?: string;
  startDateFieldName?: string; // Nom du champ de date de début pour calculer la durée
};

export function DatePickerField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  minDate = new Date(),
  maxDate,
  placeholder = "Sélectionner une date",
  className,
  showDuration = false,
  showRelativeDate = true,
  showDaysUntil = false,
  clearable = true,
  disabled = false,
  helperText,
  startDateFieldName,
}: Props<TFormValues>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const min = minDate ?? new Date();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: Date | null = field.value ?? null;
        const labelText = label ?? (name === "start_date" ? "Date de début" : "Date de fin");
        
        // Récupérer la date de début si disponible pour calculer la durée
        const startDate = startDateFieldName ? (control._formValues[startDateFieldName] as Date | null) : null;
        
        // Calcul des informations relatives
        const getRelativeDate = (date: Date) => {
          if (isToday(date)) return "Aujourd'hui";
          if (isTomorrow(date)) return "Demain";
          if (isYesterday(date)) return "Hier";
          return null;
        };
        
        const getDaysUntil = (date: Date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(date);
          targetDate.setHours(0, 0, 0, 0);
          const days = differenceInCalendarDays(targetDate, today);
          
          if (days === 0) return { text: "Aujourd'hui", color: "text-green-600" };
          if (days === 1) return { text: "Demain", color: "text-blue-600" };
          if (days === -1) return { text: "Hier", color: "text-gray-600" };
          if (days > 0) return { text: `Dans ${days} jours`, color: "text-blue-600" };
          return { text: `Il y a ${Math.abs(days)} jours`, color: "text-gray-600" };
        };

        const getStatusIcon = (date: Date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(date);
          targetDate.setHours(0, 0, 0, 0);
          const days = differenceInCalendarDays(targetDate, today);
          
          if (days < 0) return <AlertCircle className="h-4 w-4 text-red-500" />;
          if (days === 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
          if (days <= 7) return <Clock className="h-4 w-4 text-orange-500" />;
          return <CalendarIcon className="h-4 w-4 text-blue-500" />;
        };

        // Calcul de la durée entre les dates
        const getDuration = () => {
          if (!startDate || !value) return null;
          const days = differenceInCalendarDays(value, startDate);
          if (days === 0) return "Même jour";
          if (days === 1) return "1 jour";
          return `${Math.abs(days)} jours`;
        };

        return (
          <div className={cn("flex flex-col space-y-3", className)}>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                {labelText}
              </label>
              {helperText && (
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {helperText}
                  </div>
                </div>
              )}
            </div>

            <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between text-left font-normal h-12 px-3 transition-all",
                    !value && "text-muted-foreground bg-gray-50",
                    disabled && "opacity-50 cursor-not-allowed",
                    value && "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {value && getStatusIcon(value)}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {value ? format(value, "dd/MM/yyyy", { locale: fr }) : placeholder}
                      </span>
                      {value && showRelativeDate && (
                        <span className="text-xs text-muted-foreground">
                          {getRelativeDate(value) || format(value, "EEEE", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {clearable && value && !disabled && (
                      <button
                        type="button"
                        aria-label="Effacer la date"
                        className="p-1 rounded-md hover:bg-red-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          field.onChange(null);
                        }}
                      >
                        <XIcon className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </div>
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0 bg-white border shadow-xl rounded-lg" align="start" side="bottom">
                <div className="p-3 space-y-3">
                  {/* En-tête du calendrier */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="text-sm font-medium text-gray-700">
                      {value ? format(value, "MMMM yyyy", { locale: fr }) : "Choisir une date"}
                    </div>
                    {value && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getStatusIcon(value)}
                        <span>{getDaysUntil(value).text}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Calendrier */}
                  <Calendar
                    mode="single"
                    selected={value || undefined}
                    onSelect={(d: Date | undefined) => {
                      field.onChange(d ?? null);
                      setIsOpen(false);
                    }}
                    disabled={(date: Date) => {
                      if (date < min) return true;
                      if (maxDate && date > maxDate) return true;
                      return false;
                    }}
                    locale={fr}
                    className="rounded-md"
                  />
                  
                  {/* Actions rapides */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => field.onChange(new Date())}
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => field.onChange(addDays(new Date(), 1))}
                    >
                      Demain
                    </Button>
                    {clearable && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => field.onChange(null)}
                      >
                        Effacer
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages d'erreur et informations */}
            {fieldState.error ? (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-md">
                <AlertCircle className="h-3 w-3" />
                <span>{fieldState.error.message}</span>
              </div>
            ) : null}

            {/* Informations additionnelles */}
            {value && !fieldState.error && (
              <div className="space-y-2">
                {showDaysUntil && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs p-2 rounded-md",
                    getDaysUntil(value).color.includes("green") ? "bg-green-50 text-green-700" :
                    getDaysUntil(value).color.includes("blue") ? "bg-blue-50 text-blue-700" :
                    getDaysUntil(value).color.includes("orange") ? "bg-orange-50 text-orange-700" :
                    "bg-gray-50 text-gray-700"
                  )}>
                    {getStatusIcon(value)}
                    <span className="font-medium">{getDaysUntil(value).text}</span>
                    <span className="text-muted-foreground">
                      ({format(value, "EEEE dd MMMM yyyy", { locale: fr })})
                    </span>
                  </div>
                )}

                {showDuration && (
                  <div className="text-xs text-blue-700 bg-blue-50 rounded-md p-2">
                    <div className="font-medium mb-2">Informations date</div>
                    <div className="space-y-2">
                      {startDate && (
                        <div>
                          <div className="font-medium text-blue-800">Date de début :</div>
                          <div className="font-semibold">{format(startDate, "dd/MM/yyyy", { locale: fr })}</div>
                          <div className="text-muted-foreground">
                            {format(startDate, "EEEE", { locale: fr })} • semaine {getWeek(startDate, { weekStartsOn: 1 })}
                          </div>
                        </div>
                      )}
                      <div className={startDate ? "pt-2 border-t border-blue-200" : ""}>
                        <div className="font-medium text-blue-800">Date de fin :</div>
                        <div className="font-semibold">{format(value, "dd/MM/yyyy", { locale: fr })}</div>
                        <div className="text-muted-foreground">
                          {format(value, "EEEE", { locale: fr })} • semaine {getWeek(value, { weekStartsOn: 1 })}
                        </div>
                      </div>
                      {startDate && (
                        <div className="pt-2 border-t border-blue-200">
                          <div className="font-medium text-blue-600">
                            Durée de la campagne : {getDuration()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}