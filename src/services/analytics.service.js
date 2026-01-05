// src/services/analytics.service.js
const Event = require('../models/Event');

class AnalyticsService {
  /**
   * Track event view
   * @param {string} eventId - Event ID
   * @param {Object} metadata - Additional tracking data
   */
  async trackEventView(eventId, metadata = {}) {
    try {
      const updateData = {
        $inc: { 'metrics.views': 1 },
        $set: { 'metrics.lastViewed': new Date() }
      };

      // Track demographics if provided
      if (metadata.country) {
        updateData.$inc = {
          ...updateData.$inc,
          [`metrics.demographics.countries.${metadata.country}`]: 1
        };
      }

      if (metadata.city) {
        updateData.$inc = {
          ...updateData.$inc,
          [`metrics.demographics.cities.${metadata.city}`]: 1
        };
      }

      if (metadata.device) {
        updateData.$inc = {
          ...updateData.$inc,
          [`metrics.traffic.devices.${metadata.device}`]: 1
        };
      }

      if (metadata.browser) {
        updateData.$inc = {
          ...updateData.$inc,
          [`metrics.traffic.browsers.${metadata.browser}`]: 1
        };
      }

      if (metadata.source) {
        updateData.$inc = {
          ...updateData.$inc,
          [`metrics.traffic.sources.${metadata.source}`]: 1
        };
      }

      await Event.findByIdAndUpdate(eventId, updateData);
      console.log(`📊 Tracked view for event ${eventId}`);
    } catch (error) {
      console.error('Failed to track event view:', error);
    }
  }

  /**
   * Track event click (e.g., registration button click)
   * @param {string} eventId - Event ID
   * @param {string} clickType - Type of click (register, share, etc.)
   * @param {Object} metadata - Additional tracking data
   */
  async trackEventClick(eventId, clickType = 'register', metadata = {}) {
    try {
      const updateData = {
        $inc: { 'metrics.clicks': 1 }
      };

      // Track specific click types
      if (clickType === 'register') {
        updateData.$inc['metrics.registrations'] = 1;
      } else if (clickType === 'share') {
        updateData.$inc['metrics.shares'] = 1;
      }

      await Event.findByIdAndUpdate(eventId, updateData);
      console.log(`📊 Tracked ${clickType} click for event ${eventId}`);
    } catch (error) {
      console.error('Failed to track event click:', error);
    }
  }

  /**
   * Track time spent on event page
   * @param {string} eventId - Event ID
   * @param {number} timeSpent - Time in seconds
   */
  async trackTimeSpent(eventId, timeSpent) {
    try {
      // Get current metrics to calculate new average
      const event = await Event.findById(eventId).select('metrics');
      if (!event) return;

      const currentTotalTime = event.metrics?.engagement?.totalTimeSpent || 0;
      const currentViews = event.metrics?.views || 1; // Avoid division by zero

      const newTotalTime = currentTotalTime + timeSpent;
      const newAverageTime = Math.round(newTotalTime / currentViews);

      await Event.findByIdAndUpdate(eventId, {
        $inc: { 'metrics.engagement.totalTimeSpent': timeSpent },
        $set: { 'metrics.engagement.averageTimeSpent': newAverageTime }
      });

      console.log(`📊 Tracked ${timeSpent}s time spent for event ${eventId}`);
    } catch (error) {
      console.error('Failed to track time spent:', error);
    }
  }

  /**
   * Get event analytics
   * @param {string} eventId - Event ID
   * @returns {Object} Analytics data
   */
  async getEventAnalytics(eventId) {
    try {
      const event = await Event.findById(eventId).select('metrics title');
      if (!event) return null;

      const metrics = event.metrics || {};

      // Calculate engagement rate
      const views = metrics.views || 0;
      const clicks = metrics.clicks || 0;
      const registrations = metrics.registrations || 0;

      const engagementRate = views > 0 ? Math.round((clicks / views) * 100) : 0;
      const conversionRate = views > 0 ? Math.round((registrations / views) * 100) : 0;

      return {
        eventId,
        eventTitle: event.title,
        summary: {
          views,
          clicks,
          registrations,
          shares: metrics.shares || 0,
          engagementRate: `${engagementRate}%`,
          conversionRate: `${conversionRate}%`
        },
        engagement: {
          totalTimeSpent: metrics.engagement?.totalTimeSpent || 0,
          averageTimeSpent: metrics.engagement?.averageTimeSpent || 0,
          bounceRate: metrics.engagement?.bounceRate || 0
        },
        demographics: {
          topCountries: this.getTopItems(metrics.demographics?.countries || [], 5),
          topCities: this.getTopItems(metrics.demographics?.cities || [], 5),
          ageGroups: metrics.demographics?.ageGroups || [],
          professions: metrics.demographics?.professions || []
        },
        traffic: {
          sources: this.getTopItems(metrics.traffic?.sources || [], 5),
          devices: this.getTopItems(metrics.traffic?.devices || [], 5),
          browsers: this.getTopItems(metrics.traffic?.browsers || [], 5)
        },
        lastUpdated: metrics.lastViewed
      };
    } catch (error) {
      console.error('Failed to get event analytics:', error);
      return null;
    }
  }

  /**
   * Get overall analytics for all events
   * @param {Object} filters - Filter options
   * @returns {Object} Overall analytics
   */
  async getOverallAnalytics(filters = {}) {
    try {
      const matchConditions = {};

      // Add date filters
      if (filters.startDate || filters.endDate) {
        matchConditions.createdAt = {};
        if (filters.startDate) matchConditions.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) matchConditions.createdAt.$lte = new Date(filters.endDate);
      }

      // Add status filter
      if (filters.status) {
        matchConditions.status = filters.status;
      }

      const events = await Event.find(matchConditions).select('metrics title status createdAt');

      let totalViews = 0;
      let totalClicks = 0;
      let totalRegistrations = 0;
      let totalShares = 0;
      let totalEvents = events.length;

      const eventAnalytics = events.map(event => {
        const metrics = event.metrics || {};
        const views = metrics.views || 0;
        const clicks = metrics.clicks || 0;
        const registrations = metrics.registrations || 0;
        const shares = metrics.shares || 0;

        totalViews += views;
        totalClicks += clicks;
        totalRegistrations += registrations;
        totalShares += shares;

        return {
          eventId: event._id,
          title: event.title,
          status: event.status,
          views,
          clicks,
          registrations,
          shares,
          engagementRate: views > 0 ? Math.round((clicks / views) * 100) : 0,
          conversionRate: views > 0 ? Math.round((registrations / views) * 100) : 0
        };
      });

      const overallEngagementRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
      const overallConversionRate = totalViews > 0 ? Math.round((totalRegistrations / totalViews) * 100) : 0;

      return {
        summary: {
          totalEvents,
          totalViews,
          totalClicks,
          totalRegistrations,
          totalShares,
          overallEngagementRate: `${overallEngagementRate}%`,
          overallConversionRate: `${overallConversionRate}%`
        },
        events: eventAnalytics,
        filters: filters
      };
    } catch (error) {
      console.error('Failed to get overall analytics:', error);
      return null;
    }
  }

  /**
   * Helper method to get top items from array
   * @param {Array} items - Array of items with count
   * @param {number} limit - Number of top items to return
   * @returns {Array} Top items sorted by count
   */
  getTopItems(items, limit = 5) {
    return items
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit)
      .map(item => ({
        name: item.country || item.city || item.source || item.device || item.browser || item.profession || item.range,
        count: item.count || 0
      }));
  }

  /**
   * Reset analytics for an event (useful for testing)
   * @param {string} eventId - Event ID
   */
  async resetEventAnalytics(eventId) {
    try {
      await Event.findByIdAndUpdate(eventId, {
        $set: {
          'metrics.views': 0,
          'metrics.clicks': 0,
          'metrics.registrations': 0,
          'metrics.shares': 0,
          'metrics.engagement.totalTimeSpent': 0,
          'metrics.engagement.averageTimeSpent': 0,
          'metrics.engagement.bounceRate': 0,
          'metrics.demographics.countries': [],
          'metrics.demographics.cities': [],
          'metrics.demographics.ageGroups': [],
          'metrics.demographics.professions': [],
          'metrics.traffic.sources': [],
          'metrics.traffic.referrers': [],
          'metrics.traffic.devices': [],
          'metrics.traffic.browsers': []
        }
      });
      console.log(`📊 Reset analytics for event ${eventId}`);
    } catch (error) {
      console.error('Failed to reset event analytics:', error);
    }
  }
}

module.exports = new AnalyticsService();
