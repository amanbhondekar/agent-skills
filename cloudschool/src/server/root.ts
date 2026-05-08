import { router } from './trpc';
import { studentRouter  } from './routers/student';
import { facultyRouter  } from './routers/faculty';
import { courseRouter   } from './routers/course';
import { gradeRouter    } from './routers/grade';
import { feeRouter      } from './routers/fee';
import { payrollRouter  } from './routers/payroll';
import { dashboardRouter} from './routers/dashboard';
import { searchRouter   } from './routers/search';

export const appRouter = router({
  student:   studentRouter,
  faculty:   facultyRouter,
  course:    courseRouter,
  grade:     gradeRouter,
  fee:       feeRouter,
  payroll:   payrollRouter,
  dashboard: dashboardRouter,
  search:    searchRouter,
});

export type AppRouter = typeof appRouter;
