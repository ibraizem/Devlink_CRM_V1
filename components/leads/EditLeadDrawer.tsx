'use client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function EditLeadDrawer({ open, onOpenChange, lead }: any) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (lead) setFormData(lead);
  }, [lead]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await supabase.from('leads').update(formData).eq('id', lead.id);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-6 space-y-4">
        <DrawerHeader>
          <DrawerTitle>Modifier le lead</DrawerTitle>
        </DrawerHeader>

        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{key}</label>
            <input
              className="w-full border rounded-md px-2 py-1 text-sm"
              value={value ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}

        <Button onClick={handleSave} className="w-full mt-3">
          Enregistrer
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
