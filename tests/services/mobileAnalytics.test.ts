jest.mock('../../src/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        component: jest.fn(),
    },
}));

import { mobileAnalyticsService } from '../../src/services/mobileAnalytics';
import logger from '../../src/utils/logger';
import { AnalyticsEvent } from '../../src/utils/trackingEvents';

describe('mobileAnalyticsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('logs event payload when trackEvent is called', () => {
        mobileAnalyticsService.trackEvent(AnalyticsEvent.UI_CLICK, { button: 'save' });

        expect(logger.info).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('Event: ui_click'),
            expect.any(String)
        );
    });

    it('tracks a screen and emits screen view logging', () => {
        mobileAnalyticsService.trackScreen('Home');

        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('Screen View: Home'),
            expect.objectContaining({ previous_screen: null })
        );
    });

    it('throttles high-frequency events to at most 10 per second per event name', () => {
        const nowSpy = jest.spyOn(Date, 'now');
        nowSpy
            .mockReturnValueOnce(1000)
            .mockReturnValueOnce(1020)
            .mockReturnValueOnce(1060)
            .mockReturnValueOnce(1110);

        mobileAnalyticsService.trackEvent(AnalyticsEvent.PERFORMANCE_METRIC, {
            event_category: 'high_frequency',
            event_name: 'lesson_carousel_scroll',
        });
        mobileAnalyticsService.trackEvent(AnalyticsEvent.PERFORMANCE_METRIC, {
            event_category: 'high_frequency',
            event_name: 'lesson_carousel_scroll',
        });
        mobileAnalyticsService.trackEvent(AnalyticsEvent.PERFORMANCE_METRIC, {
            event_category: 'high_frequency',
            event_name: 'lesson_carousel_scroll',
        });
        mobileAnalyticsService.trackEvent(AnalyticsEvent.PERFORMANCE_METRIC, {
            event_category: 'high_frequency',
            event_name: 'lesson_carousel_scroll',
        });

        const analyticsCalls = (logger.info as jest.Mock).mock.calls.filter(call =>
            String(call[0]).includes('Event: performance_metric')
        );

        expect(analyticsCalls).toHaveLength(2);
        nowSpy.mockRestore();
    });
});
