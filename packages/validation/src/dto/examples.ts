import { Type, type TSchema } from '@sinclair/typebox';
import { 
  IsString, 
  IsEmail, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  Min, 
  Max, 
  Length 
} from '../decorators/validation';

/**
 * 用户创建 DTO 示例
 */
export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber()
  @Min(0)
  @Max(120)
  age!: number;

  @IsString()
  @Length(8, 100)
  password!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray(Type.String())
  tags?: string[];
}

/**
 * 用户更新 DTO 示例
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ minLength: 2, maxLength: 50 })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray(Type.String())
  tags?: string[];
}

/**
 * 查询参数 DTO 示例
 */
export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
