<template>
    <div v-if="! state.codeValidated" class="password_reset">
        <h3>{{ t('check_email_title') }}</h3>
        <p>{{ t('check_email') }} {{ state.email }}.</p>
        <input type="text" v-model="state.reset_code" :placeholder="t('reset_code')" >
        <button class="primary" @click="submitResetCode">{{ t('reset_button') }}</button>
        <router-link :to="{ name: 'login', params: { em: state.email }}" >{{ t("login_link") }}</router-link>
        <div v-if="state.form_error" class="error">{{ t(state.form_error) }}</div>
    </div>
    <div v-else class="password_reset">
        <h3>{{ state.isRegistration ? t('new_account_password_title') : t('code_validated_title') }}</h3>
        <p>{{ state.isRegistration ? t('registration_new_password') : t('set_password_prompt') }}</p>
        <input type="password" :placeholder="t('password_placeholder')" v-model="state.password">
        <input type="password" :placeholder="t('password2_placeholder')" v-model="state.password2" @keyup.enter="setPassword">
        <button type="button" @click="setPassword" class="primary icofont-arrow-right"><span class="sr-only">Next</span></button>
        <div v-if="state.form_error" class="error">{{ t(state.form_error) }}</div>
    </div>
</template>

<style lang="scss">
@use '../assets/mixins' as *;

div.password_reset {
    @include auth-form;
}
@include dark-mode {
    div.password_reset {
        @include auth-form-dark-mode;
    }
}

</style>

<script setup>
    import { reactive, onBeforeMount, inject } from 'vue';
    import { useRouter, useRoute } from 'vue-router'
    import { useI18n } from 'vue-i18n';

    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n({
        messages: {
            en: {
                check_email_title: 'Password Reset Sent',
                new_account_password_title: 'Welcome to your new account',
                check_email: 'We have sent a code to reset your password to',
                code_validated_title: 'Valid Code',
                set_password_prompt: 'Please set a new password',
                registration_new_password: 'Please set a password',
                login_link: 'back to sign in',
                reset_code: 'reset code',
                reset_button: 'submit code',
                password_placeholder: 'password',
                password2_placeholder: 'confirm password',

                bad_token: 'invalid or expired token',
                missing_password: 'please enter a password',
                missing_password2: 'please re-type your password to confirm',
                bad_password_match: 'Passwords do not match',
                no_token_provided: 'Must provide a password reset token',
                no_password_provided: 'Must provide a password',
                unknown_error: 'An unknown error occurred'
            }
        }
    });
    const authn = inject('authn');

    const state = reactive({
        reset_code: route.query.code || '',
        email: route.query.email || '',
        codeValidated: false,
        password:    '',
        password2:   '',
        form_error: ''
    });

    onBeforeMount(async () => {
        if ( state.reset_code ) {
            console.log("checking password reset token");
            await submitResetCode();
        }
    });

    async function submitResetCode() {

        state.form_error = '';
        const response = await authn.check_password_reset_token(state.reset_code);
        console.log(response);
        if ( response.message == 'ok' ) {
            state.codeValidated = true;
            state.isRegistration = response.isNewAccount;
        }
        else {
            state.codeValidated = false;
            state.form_error = 'bad_token';
        }
    }

    async function setPassword() {
        if ( ! state.password.length ) {
            state.form_error = 'missing_password';
        }
        else if ( ! state.password2.length ) {
            state.form_error = 'missing_password2';
        }
        else if ( state.password != state.password2 ) {
            state.form_error = 'bad_password_match';
        }
        else {
            state.form_error = '';
            try {
                await authn.use_password_reset_token(state.reset_code, state.password);
                router.push('/auth/login');
            }
            catch (error) {
                let error_text = "unknown_error";

                if ( typeof error  == "object" && "response" in error ) {
                    error_text = error.response.data || error.response.status;
                }
                else if ( typeof error == "string" ) {
                    error_text = error;
                }
                else {
                    console.log(error);
                }

                state.form_error = t( error_text ) || error_text;
            }
        }
    }

</script>

