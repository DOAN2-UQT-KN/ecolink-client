import { IBaseResponse } from '@/types/BaseResponse';
import { IPoint } from './point';

export interface IGetPointRequest {}

export interface IGetPointResponse extends IBaseResponse<IPoint> {}
