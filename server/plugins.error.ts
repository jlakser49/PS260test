import type { H3Error, H3Event } from 'h3'

export default defineNitroPlugin((nitroApp) => {
    const h3OnError = nitroApp.h3App.options.onError;
    nitroApp.h3App.options.onError = (error : Error, event : H3Event) => {
        let h3error : H3Error = error as H3Error;
        
        if(h3error?.statusCode === 404)
        {
            h3error.unhandled = false;
        }

        if(h3OnError !== undefined)
        {
            return h3OnError(error, event);
        }
        return;
    };
})