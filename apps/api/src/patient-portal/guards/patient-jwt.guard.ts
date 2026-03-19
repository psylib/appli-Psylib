import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PatientJwtGuard extends AuthGuard('patient-jwt') {}
