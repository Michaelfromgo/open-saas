import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { styled } from 'wasp/core/stitches.config';
import { config } from 'wasp/client';
import { AuthContext } from '../../Auth';
import { Form, FormInput, FormItemGroup, FormLabel, FormError, FormTextarea, SubmitButton, } from '../Form';
import * as SocialIcons from '../social/SocialIcons';
import { SocialButton } from '../social/SocialButton';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../email/useEmail';
const OrContinueWith = styled('div', {
    position: 'relative',
    marginTop: '1.5rem'
});
const OrContinueWithLineContainer = styled('div', {
    position: 'absolute',
    inset: '0px',
    display: 'flex',
    alignItems: 'center'
});
const OrContinueWithLine = styled('div', {
    width: '100%',
    borderTopWidth: '1px',
    borderColor: '$gray500'
});
const OrContinueWithTextContainer = styled('div', {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    fontSize: '$sm'
});
const OrContinueWithText = styled('span', {
    backgroundColor: 'white',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
});
const SocialAuth = styled('div', {
    marginTop: '1.5rem'
});
const SocialAuthLabel = styled('div', {
    fontWeight: '500',
    fontSize: '$sm'
});
const SocialAuthButtons = styled('div', {
    marginTop: '0.5rem',
    display: 'flex',
    variants: {
        direction: {
            horizontal: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(48px, 1fr))',
            },
            vertical: {
                flexDirection: 'column',
                margin: '8px 0',
            }
        },
        gap: {
            small: {
                gap: '4px',
            },
            medium: {
                gap: '8px',
            },
            large: {
                gap: '16px',
            }
        }
    }
});
const googleSignInUrl = `${config.apiUrl}/auth/google/login`;
// PRIVATE API
export const LoginSignupForm = ({ state, socialButtonsDirection = 'horizontal', additionalSignupFields, }) => {
    const { isLoading, setErrorMessage, setSuccessMessage, setIsLoading, } = useContext(AuthContext);
    const isLogin = state === 'login';
    const cta = isLogin ? 'Log in' : 'Sign up';
    const navigate = useNavigate();
    const onErrorHandler = (error) => {
        var _a, _b;
        setErrorMessage({ title: error.message, description: (_b = (_a = error.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message });
    };
    const hookForm = useForm();
    const { register, formState: { errors }, handleSubmit: hookFormHandleSubmit } = hookForm;
    const { handleSubmit } = useEmail({
        isLogin,
        onError: onErrorHandler,
        showEmailVerificationPending() {
            hookForm.reset();
            setSuccessMessage(`You've signed up successfully! Check your email for the confirmation link.`);
        },
        onLoginSuccess() {
            navigate('/demo-app');
        },
    });
    async function onSubmit(data) {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await handleSubmit(data);
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<>
        <SocialAuth>
          <SocialAuthLabel>{cta} with</SocialAuthLabel>
          <SocialAuthButtons gap='large' direction={socialButtonsDirection}>
              <SocialButton href={googleSignInUrl}><SocialIcons.Google /></SocialButton>


          </SocialAuthButtons>
        </SocialAuth>
        <OrContinueWith>
          <OrContinueWithLineContainer>
            <OrContinueWithLine />
          </OrContinueWithLineContainer>
          <OrContinueWithTextContainer>
            <OrContinueWithText>Or continue with</OrContinueWithText>
          </OrContinueWithTextContainer>
        </OrContinueWith>
        <Form onSubmit={hookFormHandleSubmit(onSubmit)}>
          <FormItemGroup>
            <FormLabel>E-mail</FormLabel>
            <FormInput {...register('email', {
        required: 'Email is required',
    })} type="email" disabled={isLoading}/>
            {errors.email && <FormError>{errors.email.message}</FormError>}
          </FormItemGroup>
          <FormItemGroup>
            <FormLabel>Password</FormLabel>
            <FormInput {...register('password', {
        required: 'Password is required',
    })} type="password" disabled={isLoading}/>
            {errors.password && <FormError>{errors.password.message}</FormError>}
          </FormItemGroup>
          <AdditionalFormFields hookForm={hookForm} formState={{ isLoading }} additionalSignupFields={additionalSignupFields}/>
          <FormItemGroup>
            <SubmitButton type="submit" disabled={isLoading}>{cta}</SubmitButton>
          </FormItemGroup>
        </Form>
  </>);
};
function AdditionalFormFields({ hookForm, formState: { isLoading }, additionalSignupFields, }) {
    const { register, formState: { errors }, } = hookForm;
    function renderField(field, 
    // Ideally we would use ComponentType here, but it doesn't work with react-hook-form
    Component, props) {
        var _a;
        const errorMessage = (_a = errors[field.name]) === null || _a === void 0 ? void 0 : _a.message;
        return (<FormItemGroup key={field.name}>
        <FormLabel>{field.label}</FormLabel>
        <Component {...register(field.name, field.validations)} {...props} disabled={isLoading}/>
        {errorMessage && (<FormError>{errorMessage}</FormError>)}
      </FormItemGroup>);
    }
    if (areAdditionalFieldsRenderFn(additionalSignupFields)) {
        return additionalSignupFields(hookForm, { isLoading });
    }
    return (additionalSignupFields &&
        additionalSignupFields.map((field) => {
            if (isFieldRenderFn(field)) {
                return field(hookForm, { isLoading });
            }
            switch (field.type) {
                case 'input':
                    return renderField(field, FormInput, {
                        type: 'text',
                    });
                case 'textarea':
                    return renderField(field, FormTextarea);
                default:
                    throw new Error(`Unsupported additional signup field type: ${field.type}`);
            }
        }));
}
function isFieldRenderFn(additionalSignupField) {
    return typeof additionalSignupField === 'function';
}
function areAdditionalFieldsRenderFn(additionalSignupFields) {
    return typeof additionalSignupFields === 'function';
}
//# sourceMappingURL=LoginSignupForm.jsx.map