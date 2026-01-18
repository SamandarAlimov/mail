import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  ChevronRight,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CalendarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const events = [
  {
    id: "1",
    title: "Q4 Planning Review",
    time: "10:00 AM - 11:30 AM",
    location: "Conference Room A",
    attendees: ["Marcus Chen", "Sarah Williams", "Elena Rodriguez"],
    isVideo: true,
    color: "#f26c21"
  },
  {
    id: "2",
    title: "Series C Follow-up Call",
    time: "2:00 PM - 3:00 PM",
    location: "Virtual Meeting",
    attendees: ["James Park", "Investment Team"],
    isVideo: true,
    color: "#22c55e"
  },
  {
    id: "3",
    title: "Design System Workshop",
    time: "4:00 PM - 5:30 PM",
    location: "Design Lab",
    attendees: ["Elena Rodriguez", "Design Team"],
    isVideo: false,
    color: "#8b5cf6"
  }
];

const upcomingEvents = [
  { id: "4", title: "Weekly Standup", date: "Tomorrow, 9:00 AM" },
  { id: "5", title: "Product Demo", date: "Wed, Dec 18, 3:00 PM" },
  { id: "6", title: "Team Retrospective", date: "Fri, Dec 20, 2:00 PM" },
];

export function CalendarPanel({ isOpen, onClose }: CalendarPanelProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Calendar</h2>
                  <p className="text-sm text-muted-foreground">{today}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Today's Schedule</h3>
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  New Event
                </Button>
              </div>

              <div className="space-y-3 mb-8">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card rounded-xl p-4 cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-1 rounded-full shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          {event.isVideo ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="flex -space-x-2">
                            {event.attendees.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium"
                              >
                                {event.attendees[i]?.charAt(0)}
                              </div>
                            ))}
                            {event.attendees.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary">
                                +{event.attendees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <Separator className="mb-6" />

              <h3 className="font-semibold mb-4">Upcoming</h3>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm">{event.title}</span>
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button variant="secondary" className="w-full">
                Open Calendar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
