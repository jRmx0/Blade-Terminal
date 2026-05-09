// Environment generator proposal (documentation / implementation spec)
//
// Goal
// ----
// Construct obstacle cells iteratively (cell-by-cell), instead of placing many
// and stabilizing afterwards.
//
// This spec defines:
// - candidate selection rules,
// - clustering / non-clustering operation switching,
// - pocket-prevention semantics,
// - target obstacle count calculation,
// - output contract at cell level.
//
// Terminology
// -----------
// - Free cell: currently not obstacle.
// - Obstacle cell: currently occupied by obstacle.
// - Zone edge (Z): outside of the rectangular grid.
// - Candidate cell (C): free cell evaluated for placement.
// - Obstacle neighbour (O): already placed obstacle cell.
//
// Iteration state (recomputed every placement)
// --------------------------------------------
// 1) AvailableCellsForNonClustering
// 2) AvailableCellsForClustering
//
// Both datasets MUST be recomputed from scratch at each iteration.
//
// Operation selection
// -------------------
// At each placement iteration, operation type is selected by Bernoulli draw:
// - P(Clustering) = clusteringPct / 100
// - P(NonClustering) = 1 - P(Clustering)
//
// Target obstacle count
// ---------------------
// For explicit obstacle ratio, target count is:
//   targetObstacleCells = floor(totalCells * obstacleRatioPct / 100)
//
// Candidate rules
// ---------------
// Rules for AvailableCellsForNonClustering:
// - Candidate has NO obstacle neighbours in 8-neighbourhood
//   (orthogonal + diagonal).
//
//   0 0 0
//   0 C 0
//   0 0 0
//
// - Candidate may be next to zone edge.
//
//   Z 0 0
//   Z C 0
//   Z Z Z
//
//   Or:
//
//   Z 0 0
//   Z C 0
//   Z 0 0
//
// Rules for AvailableCellsForClustering:
// - Candidate has at least one ORTHOGONAL (4-neighbour) obstacle neighbour.
//
//   0 0 0
//   0 C O
//   0 0 0
//
// - Diagonal-only contact does NOT qualify as clustering.
//
//   0 0 O
//   0 C 0
//   0 0 0
//
// Pocket-prevention rule
// ----------------------
// Every candidate in AvailableCellsForClustering MUST be validated for pocket
// creation before it can be selected.
//
// Pocket definition:
// - A pocket is an enclosed free-space island created by placing the candidate,
//   regardless of any chosen start point.
//
// If candidate forms a pocket, candidate is removed from clustering candidates.
//
// Fallback / switching rules
// --------------------------
// - If chosen operation is NonClustering, but its candidate set is empty,
//   switch to Clustering and pick from its candidates.
// - If chosen operation is Clustering, but its candidate set is empty,
//   switch to NonClustering and pick from its candidates.
// - If BOTH candidate sets are empty before reaching targetObstacleCells,
//   STOP early and report achieved ratio/count.
//
// High-level pseudo code
// ----------------------
// CalcObstacleCellCount()  // using floor(totalCells * obstacleRatioPct / 100)
//
// For each obstacle cell to place:
// begin
//   CalcOperationType() // Bernoulli draw by clusteringPct
//
//   Case OperationType of:
//     OperationType::NonClustering:
//       begin
//         CalcAvailableCellsForNonClustering()
//         if not AvailableCellsForNonClustering.IsEmpty() then
//           PickRandomAvailableCellForNonClustering()
//         else
//           begin
//             CalcAvailableCellsForClustering()
//             FilterPocketFormingCellsFromClustering()
//             if not AvailableCellsForClustering.IsEmpty() then
//               PickRandomAvailableCellForClustering()
//             else
//               StopEarly()
//           end
//       end
//
//     OperationType::Clustering:
//       begin
//         CalcAvailableCellsForClustering()
//         FilterPocketFormingCellsFromClustering()
//         if not AvailableCellsForClustering.IsEmpty() then
//           PickRandomAvailableCellForClustering()
//         else
//           begin
//             CalcAvailableCellsForNonClustering()
//             if not AvailableCellsForNonClustering.IsEmpty() then
//               PickRandomAvailableCellForNonClustering()
//             else
//               StopEarly()
//           end
//       end
//   end
// end
//
// Output contract (important)
// ---------------------------
// - No obstacle merging.
// - Every obstacle cell is emitted as standalone obstacle geometry.
// - Border-touching obstacle cells are NOT absorbed into zone boundary;
//   they are emitted as normal obstacle cells.



