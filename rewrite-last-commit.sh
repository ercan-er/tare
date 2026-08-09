#!/bin/bash

git reset --soft HEAD~1
git commit -m "feat(payment): promo discount with reconciliation check; show discount in cart, checkout, products"
git push --force
