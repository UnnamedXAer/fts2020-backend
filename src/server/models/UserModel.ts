import { Provider } from '../CustomTypes/Types';

export default class UserModel {
    constructor(
        public id: number,
        public emailAddress: string,
        public userName: string,
        public password: string | undefined,
        public provider: Provider,
        public joinDate: Date,
		public avatarUrl: string | undefined,
		public active: boolean
    ) {}
};
