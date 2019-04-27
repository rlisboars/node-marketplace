const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const PurchaseMail = require('../jobs/PurchaseMail')
const Queue = require('../services/Queue')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body
    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    const purchase = await Purchase.create({
      ad,
      content,
      user: user._id
    })

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    return res.json(purchase)
  }

  async accept (req, res) {
    const { id } = req.params
    let purchase = await Purchase.findById(id).populate('ad')

    if ('' + purchase.ad.author === req.userId) {
      if (purchase.ad.purchasedBy) {
        return res.json({ error: 'ad already purchased' })
      }
      purchase = await Purchase.findByIdAndUpdate(id, { accepted: true })
      await Ad.findByIdAndUpdate(purchase.ad, {
        purchasedBy: purchase._id
      })
      return res.json(purchase)
    }
    return res.json({
      error: 'you dont have permission to accept that proposal'
    })
  }
}
module.exports = new PurchaseController()
