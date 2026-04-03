import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StudentCurriculumSidebar } from '../components/student/StudentCurriculumSidebar';
import { SELECTED_CLASS_STORAGE_KEY } from '../lib/studentNavigation';

export function StudentClassLayout() {
  const { classId } = useParams<{ classId: string }>();
  const [className, setClassName] = useState<string>('');

  useEffect(() => {
    if (classId) localStorage.setItem(SELECTED_CLASS_STORAGE_KEY, classId);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.name) setClassName(data.name);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  if (!classId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        Invalid class
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <StudentCurriculumSidebar classId={classId} classLabel={className || undefined} homeTo="/home" />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
