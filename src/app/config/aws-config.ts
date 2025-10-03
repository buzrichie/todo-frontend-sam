import { environment } from '../../environments/environment';

export default {
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolWebClientId,
      loginWith: {
        email: true,
      },
    },
  },
};
