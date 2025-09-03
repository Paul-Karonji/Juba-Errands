const shipmentService = require('../services/shipmentService');
const { validationResult } = require('express-validator');

const shipmentController = {
  // Get all shipments with filters
  getAllShipments: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
      
      const filters = {
        status: status !== 'All' ? status : null,
        search,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await shipmentService.getAllShipments(filters);
      
      res.json({
        success: true,
        data: result.shipments,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get shipment by ID
  getShipmentById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const shipment = await shipmentService.getShipmentById(id);
      
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        data: shipment
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new shipment
  createShipment: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const shipmentData = req.body;
      const newShipment = await shipmentService.createCompleteShipment(shipmentData);

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: newShipment
      });
    } catch (error) {
      next(error);
    }
  },

  // Update shipment
  updateShipment: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;
      
      const updatedShipment = await shipmentService.updateShipment(id, updates);
      
      if (!updatedShipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        message: 'Shipment updated successfully',
        data: updatedShipment
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete shipment
  deleteShipment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await shipmentService.deleteShipment(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        message: 'Shipment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get shipment by waybill number
  getByWaybillNumber: async (req, res, next) => {
    try {
      const { waybillNo } = req.params;
      const shipment = await shipmentService.getByWaybillNumber(waybillNo);
      
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        data: shipment
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = shipmentController;