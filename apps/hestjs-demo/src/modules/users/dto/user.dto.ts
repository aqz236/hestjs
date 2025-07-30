import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from '@hestjs/validation';

/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @IsString({
    minLength: 2,
    maxLength: 50,
    message: '用户名长度必须在2-50字符之间',
  })
  name!: string;

  @IsEmail({ message: '请输入有效的邮箱地址' })
  email!: string;

  @IsNumber({ message: '年龄必须是数字' })
  @Min(0, { message: '年龄不能小于0' })
  @Max(120, { message: '年龄不能大于120' })
  age!: number;

  @IsString({ message: '密码必须是字符串' })
  @Length(8, 100, { message: '密码长度必须在8-100字符之间' })
  password!: string;

  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  bio?: string;
}

/**
 * 更新用户 DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({
    minLength: 2,
    maxLength: 50,
    message: '用户名长度必须在2-50字符之间',
  })
  name?: string;

  @IsOptional()
  @IsEmail({ message: '请输入有效的邮箱地址' })
  email?: string;

  @IsOptional()
  @IsNumber({ message: '年龄必须是数字' })
  @Min(0, { message: '年龄不能小于0' })
  @Max(120, { message: '年龄不能大于120' })
  age?: number;

  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  bio?: string;
}
