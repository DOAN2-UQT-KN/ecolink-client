import { IBaseResponse } from "@/types/BaseResponse";

export interface ISaveResourceRequest {
  resource_id: string;
  resource_type: string;
}

export interface ISavedResourceData {
  savedResource: {
    id: string;
    userId: string;
    resource_id: string;
    resource_type: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  };
}

export type ISaveResourceResponse = IBaseResponse<ISavedResourceData>;
