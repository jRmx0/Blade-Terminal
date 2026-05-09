// The main data sets which have to be updated at each iteration:
// - AvailableCellsForNonClustering (cells which can be used for non-clustering operation)
// - AvailableCellsForClustering (cells which can be used for clustering operation)
// - These datasets are recomputed at each iteration from scratch.

// Rules for AvailableCellsForNonClustering:
//
//   - Cells without obstacle neighbours (diagonal included) obstacles:
//   0 0 0
//   0 C 0
//   0 0 0
//
//   - Cell can be next to the zone edge:
//   Z 0 0
//   Z C 0
//   Z Z Z
//   Or (and etc.):
//   Z 0 0
//   Z C 0
//   Z 0 0
//
// Rules for AvailableCellsForClustering:
//
//   - Cells with obstacle neighbours (having the same edge):
//   0 0 0
//   0 C O
//   0 0 0
//   Not like:
//   0 0 O
//   0 C 0
//   0 0 0

// Special rules:
//
// - If operation is non clustering, but where are no available cells for non clustering -
// switch to clustering operation.
//
// - If operation is clustering, but where are no available cells for clustering -
// switch to non clustering operation, use AvailableCellsForNonClustering
//
// - At each iteration every AvailableCellsForClustering has to be checked for not forming a pocket.
// If because of the cell a pocket would formed, the cell has to be removed from the list.


// Pseudo code for env generating algorithm:

// CalcObstacleCellCount()

// For each ObstacleCell in ObstacleCellCount:
// begin
//   CalcOperationType()
//
//   Case OperationType of:
//     OperationType::NonClustering:
//       begin
//         CalcAvailableCellsForNonClustering()
//           if not AvailableCellsForNonClustering.IsEmpty()
//             PickRandomAvailableCellForNonClustering()
//           else
//             begin
//               CalcAvailableCellsForClustering()
//               PickRandomAvailableCellForClustering()
//             end
//       end
//     OperationType::Clustering:
//       begin
//         CalcAvailableCellsForClustering()
//         if AvailableCellsForClustering.IsEmpty() then
//           PickRandomAvailableCellForNonClustering()
//         else
//           PickRandomAvailableCellForClustering()
//       end
//   end
// end

// No obstacle merging at this point. Every obstacle cell is standalone obstacle.



