import type { Task, GptResponse } from 'wasp/entities';
import type { GenerateGptResponse, CreateTask, DeleteTask, UpdateTask, GetGptResponses, GetAllTasksByUser } from 'wasp/server/operations';
import { GeneratedSchedule } from './schedule';
type GptPayload = {
    hours: string;
};
export declare const generateGptResponse: GenerateGptResponse<GptPayload, GeneratedSchedule>;
export declare const createTask: CreateTask<Pick<Task, 'description'>, Task>;
export declare const updateTask: UpdateTask<Partial<Task>, Task>;
export declare const deleteTask: DeleteTask<Pick<Task, 'id'>, Task>;
export declare const getGptResponses: GetGptResponses<void, GptResponse[]>;
export declare const getAllTasksByUser: GetAllTasksByUser<void, Task[]>;
export {};
