export default class HttpException extends Error {
    constructor(
        public statusCode: number,
        private errorMessage: string,
        public data?: object
    ) {
        super(errorMessage);
    }

    public get message(): string {
        return process.env.NODE_ENV !== 'production' && this.errorMessage
            ? this.errorMessage
            : 'Something went wrong';
    }
}
