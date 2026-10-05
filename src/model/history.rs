//! Undo/redo history for graphics.

/// Stack of pixel snapshots for undo and redo.
#[derive(Debug, Clone, PartialEq)]
pub struct History {
    undo_stack: Vec<Vec<u8>>,
    redo_stack: Vec<Vec<u8>>,
    max_steps: usize,
}

impl Default for History {
    fn default() -> Self {
        Self::new(100)
    }
}

impl History {
    pub fn new(max_steps: usize) -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_steps: max_steps.max(1),
        }
    }

    /// Push a pre-mutation snapshot onto the undo stack and clear redo.
    pub fn push_snapshot(&mut self, snapshot: Vec<u8>) {
        if self.undo_stack.len() >= self.max_steps {
            self.undo_stack.remove(0);
        }
        self.undo_stack.push(snapshot);
        self.redo_stack.clear();
    }

    /// Reverts to the last snapshot. Returns the state to restore, while pushing
    /// `current_state` onto the redo stack.
    pub fn undo(&mut self, current_state: Vec<u8>) -> Option<Vec<u8>> {
        let prev = self.undo_stack.pop()?;
        self.redo_stack.push(current_state);
        Some(prev)
    }

    /// Redoes the last undone operation. Returns the state to restore, while pushing
    /// `current_state` back onto the undo stack.
    pub fn redo(&mut self, current_state: Vec<u8>) -> Option<Vec<u8>> {
        let next = self.redo_stack.pop()?;
        self.undo_stack.push(current_state);
        Some(next)
    }

    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    pub fn undo_len(&self) -> usize {
        self.undo_stack.len()
    }

    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn undo_and_redo_cycle() {
        let mut h = History::new(10);
        let s0 = vec![0, 0, 0];
        let s1 = vec![1, 0, 0];
        let s2 = vec![1, 2, 0];

        // Action 1: changes from s0 to s1
        h.push_snapshot(s0.clone());
        assert!(h.can_undo());
        assert!(!h.can_redo());

        // Action 2: changes from s1 to s2
        h.push_snapshot(s1.clone());

        // Undo action 2: restore s1, save s2 to redo
        let restored1 = h.undo(s2.clone()).unwrap();
        assert_eq!(restored1, s1);
        assert!(h.can_undo());
        assert!(h.can_redo());

        // Undo action 1: restore s0, save s1 to redo
        let restored0 = h.undo(s1.clone()).unwrap();
        assert_eq!(restored0, s0);
        assert!(!h.can_undo());
        assert!(h.can_redo());

        // Redo action 1: restore s1, save s0 to undo
        let redone1 = h.redo(s0.clone()).unwrap();
        assert_eq!(redone1, s1);
        assert!(h.can_undo());

        // Redo action 2: restore s2, save s1 to undo
        let redone2 = h.redo(s1.clone()).unwrap();
        assert_eq!(redone2, s2);
        assert!(!h.can_redo());
    }

    #[test]
    fn pushing_new_action_clears_redo() {
        let mut h = History::new(10);
        h.push_snapshot(vec![0]);
        h.undo(vec![1]);
        assert!(h.can_redo());

        h.push_snapshot(vec![2]);
        assert!(!h.can_redo());
    }

    #[test]
    fn caps_at_max_steps() {
        let mut h = History::new(2);
        h.push_snapshot(vec![1]);
        h.push_snapshot(vec![2]);
        h.push_snapshot(vec![3]);
        assert_eq!(h.undo_stack.len(), 2);
        assert_eq!(h.undo(vec![4]).unwrap(), vec![3]);
        assert_eq!(h.undo(vec![3]).unwrap(), vec![2]);
        assert_eq!(h.undo(vec![2]), None);
    }
}
