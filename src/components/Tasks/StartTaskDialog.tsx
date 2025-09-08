import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Play } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StartTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onStartTask: (customStartDate?: string) => void;
  isRestart?: boolean;
}

export const StartTaskDialog = ({
  open,
  onOpenChange,
  taskTitle,
  onStartTask,
  isRestart = false,
}: StartTaskDialogProps) => {
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleStartTask = () => {
    if (useCustomDate && selectedDate) {
      // Format date as YYYY-MM-DD for database
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      onStartTask(formattedDate);
    } else {
      onStartTask();
    }
    onOpenChange(false);
    // Reset state
    setUseCustomDate(false);
    setSelectedDate(undefined);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state
    setUseCustomDate(false);
    setSelectedDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            {isRestart ? 'Restart Task' : 'Start Task'}
          </DialogTitle>
          <DialogDescription>
            You're about to {isRestart ? 'restart' : 'start'} working on: <span className="font-medium">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="start-now"
                name="start-option"
                checked={!useCustomDate}
                onChange={() => setUseCustomDate(false)}
                className="h-4 w-4"
              />
              <Label htmlFor="start-now" className="text-sm font-medium">
                {isRestart ? 'Restart now (use current date and time)' : 'Start now (use current date and time)'}
              </Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-date"
                  name="start-option"
                  checked={useCustomDate}
                  onChange={() => setUseCustomDate(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="custom-date" className="text-sm font-medium">
                  {isRestart ? 'Set custom restart date' : 'Set custom start date'}
                </Label>
              </div>

              {useCustomDate && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                    Select start date:
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {useCustomDate && !selectedDate && (
                    <p className="text-xs text-muted-foreground">
                      Please select a start date
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The start date will be used in the Gantt chart to show accurate project timelines and calculate task efficiency metrics.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartTask}
            disabled={useCustomDate && !selectedDate}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRestart ? 'Restart Task' : 'Start Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};