{-# OPTIONS_GHC -Wno-missing-signatures #-}

module Money.Theory.SemanticMoney_prop (tests) where

import           Data.Default
import           Test.Hspec
import           Test.QuickCheck

import           Money.Theory.SemanticMoney
import           Money.Theory.TestMonetaryTypes


--------------------------------------------------------------------------------
-- Monoidal laws for basic particle
--------------------------------------------------------------------------------

bp_monoid_identity a = a == a <> (mempty :: TestUniversalIndex) &&
                         a == (mempty :: TestUniversalIndex) <> a

bp_monoid_assoc a b c = ((a :: TestUniversalIndex) <> b) <> c == a <> (b <> c)

bp_monoid_laws = describe "basic particle monoidal laws" $ do
    it "uidx monoid identity law" $ property bp_monoid_identity
    it "uidx monoid associativity law" $ property bp_monoid_assoc


--------------------------------------------------------------------------------
-- Settle idempotency, constant rtb laws for all monetary units
--------------------------------------------------------------------------------

mu_settle_idempotency :: ( MonetaryUnit TestMonetaryTypes TestTime TestMValue mu
                      , Eq mu
                      ) => mu -> TestTime -> Bool
mu_settle_idempotency a t = settle t a == settle t (settle t a)
mu_constant_rtb :: ( MonetaryUnit TestMonetaryTypes TestTime TestMValue mu
                   ) => mu -> TestTime -> TestTime -> TestTime -> Bool
mu_constant_rtb a t1 t2 t3 = rtb (settle t2 a) t3 == rtb (settle t1 a) t3

uuidx_settle_idempotency (a :: TestUniversalIndex) = mu_settle_idempotency a
uuidx_constant_rtb (a :: TestUniversalIndex) = mu_constant_rtb a
pdidx_settle_idempotency (a :: TestPDPoolIndex) = mu_settle_idempotency a
pdidx_constant_rtb (a :: TestPDPoolIndex) = mu_constant_rtb a
pdmb_settle_idempotency (a :: TestPDPoolMemberMU) = mu_settle_idempotency a
pdmb_constant_rtb (a :: TestPDPoolIndex) u1 t1 = mu_constant_rtb b
    -- adding a new member to an existing gindex
    where (_, b) = pdpUpdateMember2 u1 t1 (a, (a, def))

mu_laws = describe "monetary unit laws" $ do
    it "uidx settle idempotency" $ property uuidx_settle_idempotency
    it "uidx constant rtb" $ property uuidx_constant_rtb
    it "pdidx settle idempotency" $ property pdidx_settle_idempotency
    it "pdidx contant rtb" $ property pdidx_constant_rtb
    it "pdmb settle idempotency" $ property pdmb_settle_idempotency
    it "pdmb contant rtb" $ property pdmb_constant_rtb

--------------------------------------------------------------------------------
-- 1to1 2-primitives
--------------------------------------------------------------------------------

uu_f1_f2 f1 f2 t1 {- f1 -} t2 {- f2 -} t3 =
    0 == rtb a' t3 + rtb b' t3
    where (a, b) = (def :: TestUniversalIndex, def :: TestUniversalIndex)
          (a', b') = f2 t2 (f1 t1 (a, b))

uu_shift2_shift2 x1 x2 = uu_f1_f2 (shift2 x1) (shift2 x2)
uu_flow2_flow2 r1 r2 = uu_f1_f2 (flow2 r1) (flow2 r2)
uu_shift2_flow2 x r = uu_f1_f2 (shift2 x) (flow2 r)
uu_flow2_shift2 r x = uu_f1_f2 (flow2 r) (shift2 x)

one2one_tests = describe "1to1 2-primitives" $ do
    it "uidx:uidx shift2 shift2" $ property uu_shift2_shift2
    it "uidx:uidx flow2 flow2"  $ property uu_flow2_flow2
    it "uidx:uidx shift2 flow2" $ property uu_shift2_flow2
    it "uidx:uidx flow2 shift2" $ property uu_flow2_shift2

--------------------------------------------------------------------------------
-- 1toN proportional distribution 2-primitives
--------------------------------------------------------------------------------

updp_u1_f1_u1_f2 f1 f2 t1 u1 t2 {- f1 -} t3 {- f2 -} t4 u2 t5 =
    0 == rtb a'' t5 + pdpMemberRTB (b'', b1') t5
    where (a, (b, b1)) = pdpUpdateMember2 u1 t1 (def :: (TestUniversalIndex, TestPDPoolMemberMU))
          (a', b') = f2 t3 (f1 t2 (a, b))
          (a'', (b'', b1')) = pdpUpdateMember2 u2 t4 (a', (b', b1))

updp_u1_f1_u2_f2 f1 f2 t1 u1 t2 {- f1 -} t3 u2 t4 {- f2 -} t5 =
    0 == rtb a''' t5 + pdpMemberRTB (b''', b1) t5 + pdpMemberRTB (b''', b2) t5
    where (a, (b, b1)) = pdpUpdateMember2 u1 t1 (def :: TestUniversalIndex, def :: TestPDPoolMemberMU)
          (a', b') = f1 t2 (a, b)
          (a'', (b'', b2)) = pdpUpdateMember2 u2 t3 (a', (b', def :: TestPDPoolMember))
          (a''', b''') = f2 t4 (a'', b'')

updp_u1_shift2_u1_shift2 x1 x2 = updp_u1_f1_u1_f2 (shift2 x1) (shift2 x2)
updp_u1_flow2_u1_flow2 r1 r2 = updp_u1_f1_u1_f2 (flow2 r1) (flow2 r2)
updp_u1_shift2_u1_flow2 x r = updp_u1_f1_u1_f2 (shift2 x) (flow2 r)
updp_u1_flow2_u1_shift2 r x = updp_u1_f1_u1_f2 (shift2 r) (flow2 x)
updp_u1_shift2_u2_shift2 x1 x2 = updp_u1_f1_u2_f2 (shift2 x1) (shift2 x2)
updp_u1_flow2_u2_flow2 r1 r2 = updp_u1_f1_u2_f2 (flow2 r1) (flow2 r2)
updp_u1_flow2_u2_shift2 r x = updp_u1_f1_u2_f2 (flow2 r) (shift2 x)
updp_u1_shift2_u2_flow2 x r = updp_u1_f1_u2_f2 (shift2 x) (flow2 r)

one2n_pd_tests = describe "1toN proportional distribution 2-primitives" $ do
    it "uidx:pdidx u1 shift2 u1 shift2" $ property updp_u1_shift2_u1_shift2
    it "uidx:pdidx u1 flow2  u1 flow2"  $ property updp_u1_flow2_u1_flow2
    it "uidx:pdidx u1 shift2 u1 flow2"  $ property updp_u1_shift2_u1_flow2
    it "uidx:pdidx u1 flow2  u1 shift2" $ property updp_u1_flow2_u1_shift2
    it "uidx:pdidx u1 shift2 u2 shift2" $ property updp_u1_shift2_u2_shift2
    it "uidx:pdidx u1 flow2  u2 flow2"  $ property updp_u1_flow2_u2_flow2
    it "uidx:pdidx u1 flow2  u2 shift2" $ property updp_u1_flow2_u2_shift2
    it "uidx:pdidx u1 shift2 u2 flow2"  $ property updp_u1_shift2_u2_flow2

--------------------------------------------------------------------------------
-- (Constant Rate) Flow 2-Primitive
--------------------------------------------------------------------------------

uu_flow2 t1 r1 t2 r2 t3 =
    r1 `mt_v_mul_t` (t2 - t1) + r2 `mt_v_mul_t` (t3 - t2) == rtb b' t3
    where (a, b) = (def :: TestUniversalIndex, def :: TestUniversalIndex)
          (_, b') = flow2 r2 t2 (flow2 r1 t1 (a, b))

updp_flow2 t1 r1 t2 r2 t3 =
    r1 `mt_v_mul_t` (t2 - t1) + r2 `mt_v_mul_t` (t3 - t2) == pdpMemberRTB (b', b1) t3
    where (a, (b, b1)) = pdpUpdateMember2 1 t1 (def :: (TestUniversalIndex, TestPDPoolMemberMU))
          (_, b') = flow2 r2 t2 (flow2 r1 t1 (a, b))

flow2_tests = describe "flow2 tests" $ do
    it "uidx:uidx flow2" $ property uu_flow2
    it "uidx:pdidx flow2" $ property updp_flow2

tests = describe "Semantic money properties" $ do
    bp_monoid_laws
    mu_laws
    one2one_tests
    one2n_pd_tests
    flow2_tests