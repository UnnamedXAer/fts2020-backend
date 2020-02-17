import { Provider } from "../CustomTypes/DbTypes";

export class UserRegisterModel {
    constructor(
        public emailAddress: string,
        public userName: string,
        public password: string,
        public confirmPassword: string,
		public provider: Provider
    ) {}
}

export class UserExternalRegisterModel {
    constructor(
        public emailAddress: string,
        public userName: string,
		public avatarUrl: string,
		public provider: Provider
    ) {}
}

export class UserChangePasswordModel {
    constructor(
		public id: string,
		public oldPassword: string,
        public password: string,
        public confirmPassword: string
    ) {}
}

