import{ expect, describe, it, afterEach } from 'vitest';
import { mountComponent } from '../test/lib/vue';
import EditEvent from '../components/edit_event.vue';
import sinon from 'sinon';
import { createMemoryHistory, createRouter, Router } from 'vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useEventStore } from '../stores/eventStore';
import ModelService from '../service/models';
import { CalendarEvent } from '../../common/model/events';

const routes: RouteRecordRaw[] = [
    { path: '/login',  component: {}, name: 'login', props: true },
    { path: '/logout', component: {}, name: 'logout' },
    { path: '/register', component: {}, name: 'register', props: true },
    { path: '/forgot', component: {}, name: 'forgot_password', props: true },
    { path: '/apply',  component: {}, name: 'register-apply', props: true },
    { path: '/reset',  component: {}, name: 'reset_password', props: true }
];

const mountedEditor = (event: CalendarEvent) => {
    let router: Router = createRouter({
        history: createMemoryHistory(),
        routes: routes
    });

    const wrapper = mountComponent(EditEvent, router, {
        provide: {
            site_config: {
                settings: {}
            },
        },
        props: {
            event: event
        }
    });

    return {
        wrapper,
        router
    }
};

describe('Editor Behavior', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    })

    it('new event', async () => {
        const { wrapper, router } = mountedEditor(new CalendarEvent('', '', ''));
        const eventStore = useEventStore();

        let createStub = sandbox.stub(ModelService, 'createModel');
        let updateStub = sandbox.stub(ModelService, 'updateModel');
        let eventStoreStub = sandbox.stub(eventStore, 'addEvent');

        createStub.resolves(new CalendarEvent('id', 'testName', 'testDescription'));

        wrapper.find('input[name="name"]').setValue('testName');
        wrapper.find('input[name="description"]').setValue('testDescription');
        
        await wrapper.find('button[type="submit"]').trigger('click');

        expect(createStub.called).toBe(true);
        expect(updateStub.called).toBe(false);
        expect(eventStoreStub.called).toBe(true);
    });

    it('existing event', async () => {
        const { wrapper, router } = mountedEditor(new CalendarEvent('hasId', '', ''));
        const eventStore = useEventStore();

        let createStub = sandbox.stub(ModelService, 'createModel');
        let updateStub = sandbox.stub(ModelService, 'updateModel');
        let eventStoreStub = sandbox.stub(eventStore, 'addEvent');

        updateStub.resolves(new CalendarEvent('hasId', 'testName', 'testDescription'));

        wrapper.find('input[name="name"]').setValue('testName');
        wrapper.find('input[name="description"]').setValue('testDescription');
        
        await wrapper.find('button[type="submit"]').trigger('click');

        expect(createStub.called).toBe(false);
        expect(updateStub.called).toBe(true);
        expect(eventStoreStub.called).toBe(false);
    });

});