import { Outlet } from 'react-router-dom';
import { SyncCurriculumFromRoute } from './SyncCurriculumFromRoute';

export function UnitScopedOutlet() {
  return (
    <>
      <SyncCurriculumFromRoute />
      <Outlet />
    </>
  );
}
