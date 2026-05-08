import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuardianJwtGuard extends AuthGuard('guardian-jwt') {}
