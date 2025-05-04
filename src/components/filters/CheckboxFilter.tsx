
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFilterProps {
  label: string;
  options: { id: string; label: string; value: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export const CheckboxFilter: React.FC<CheckboxFilterProps> = ({ 
  label, 
  options, 
  value, 
  onChange 
}) => {
  return (
    <div className="w-[150px]">
      <Label className="mb-1">{label}</Label>
      <div className="flex items-center space-x-2 pt-2">
        {options.map(option => (
          <React.Fragment key={option.id}>
            <Checkbox 
              id={option.id}
              checked={value === option.value}
              onCheckedChange={(checked) => {
                onChange(checked ? option.value : undefined);
              }}
            />
            <label
              htmlFor={option.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </label>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
