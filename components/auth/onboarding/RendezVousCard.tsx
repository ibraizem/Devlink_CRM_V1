'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, MapPin, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Appointment {
  id: number;
  title: string;
  time: string;
  type: 'video' | 'phone' | 'in-person';
  status: 'upcoming' | 'in-progress' | 'completed';
}

export function RendezVousCard() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      title: 'Call prospect Tech Corp',
      time: '14:00',
      type: 'phone',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Démo produit - StartupXYZ',
      time: '15:30',
      type: 'video',
      status: 'in-progress',
    },
    {
      id: 3,
      title: 'Meeting client important',
      time: '17:00',
      type: 'in-person',
      status: 'upcoming',
    },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const statusInterval = setInterval(() => {
      setAppointments((prev) =>
        prev.map((apt, index) => {
          if (index === 1 && apt.status === 'in-progress') {
            return apt;
          }
          if (apt.status === 'upcoming' && Math.random() > 0.8) {
            return { ...apt, status: 'in-progress' };
          }
          return apt;
        })
      );
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'phone':
        return <User className="h-3 w-3" />;
      case 'in-person':
        return <MapPin className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'in-progress':
        return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
      case 'upcoming':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 backdrop-blur-sm border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-semibold text-white">Rendez-vous</h3>
          </div>
          <p className="text-sm text-white/70">Gérez votre agenda</p>
        </div>
        <motion.div
          className="rounded-full bg-indigo-400/20 p-2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="h-4 w-4 text-indigo-300" />
        </motion.div>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">Aujourd'hui</span>
          <motion.span
            className="text-sm font-mono font-semibold text-white"
            key={currentTime.getSeconds()}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
          >
            {currentTime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </motion.span>
        </div>
      </div>

      <div className="space-y-2">
        {appointments.map((appointment, index) => (
          <motion.div
            key={appointment.id}
            className={`p-3 rounded-lg border ${getStatusColor(appointment.status)} backdrop-blur-sm`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(appointment.type)}
                  <p className="text-xs font-medium text-white truncate">
                    {appointment.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-white/50" />
                  <span className="text-xs text-white/70">{appointment.time}</span>
                </div>
              </div>
              {appointment.status === 'completed' && (
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              )}
              {appointment.status === 'in-progress' && (
                <motion.div
                  className="h-2 w-2 rounded-full bg-yellow-400 flex-shrink-0"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-4 text-center text-xs text-white/60"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        12 rendez-vous cette semaine
      </motion.div>

      <motion.div
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
}
