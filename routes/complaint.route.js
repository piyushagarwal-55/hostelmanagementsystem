const express = require('express');
const Complaint = require('../models/Complaint');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('add-complaint');
});

// ✅ 1. User submits a complaint
router.post('/add', ensureAuthenticated, async (req, res) => {
    try {
        const { roomNo, mobileNo, rollNo, title, description } = req.body;
        const newComplaint = new Complaint({
            roomNo,
            mobileNo,
            rollNo,
            title,
            description,
            status: 'Pending', // Default status
            user: req.user._id, // Assuming you're storing user info in session
        });
        await newComplaint.save();
        req.flash('success', 'Complaint submitted successfully');
        res.redirect('/complaints/my-complaints'); // Redirect to user's complaints
    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to submit complaint');
        res.redirect('/');
    }
});

// ✅ 2. User can view only their complaints
// ✅ 2. User can view only their complaints (with limited fields)
router.get('/my-complaints', ensureAuthenticated, async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id })
            .select('title description status'); // Only select title, description, and status
        res.render('my-complaints', { complaints });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// ✅ 3. Admin can view all complaints (with all fields)
// ✅ Admin can view only pending & in-progress complaints (exclude resolved)
router.get('/all', ensureAuthenticated, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        req.flash('error', 'Unauthorized Access');
        return res.redirect('/');
    }
    try {
        const complaints = await Complaint.find({ status: { $ne: 'Resolved' } }).populate('user', 'name email');
        res.render('all-complaints', { complaints });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.get('/resolved', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: 'Resolved' }).populate('user', 'name email');
        res.render('resolved-complaints', { complaints });
    } catch (error) {
        res.status(500).send('Error fetching resolved complaints');
    }
});

// ✅ 4. Admin can update complaint status
router.post('/update/:id', ensureAuthenticated, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        req.flash('error', 'Unauthorized Access');
        return res.redirect('/');
    }
    try {
        const { status } = req.body;
        await Complaint.findByIdAndUpdate(req.params.id, { status });
        req.flash('success', 'Complaint status updated');
        res.redirect('/complaints/all');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post('/update-status', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { complaintId, status } = req.body;

        // Ensure the complaint exists
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            req.flash('error', 'Complaint not found');
            return res.redirect('/complaints/all');
        }

        // Update the status
        complaint.status = status;
        await complaint.save();

        req.flash('success', 'Complaint status updated successfully');
        res.redirect('/complaints/all'); // Redirect back to complaints list
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong');
        res.redirect('/complaints/all');
    }
});

module.exports = router;
