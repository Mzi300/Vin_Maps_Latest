// src/app.module.ts (modified snippet only)
@@
   imports: [
     ScheduleModule.forRoot(),
     EventEmitterModule.forRoot(),
   ],
   controllers: [AppController],
   providers: [
     AppService,
     HealthEventService,
     { provide: APP_GUARD, useClass: ThrottlerGuard },
@@
   ],
