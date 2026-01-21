/**
 * Player DNA/Genetics System - Inherited traits and player generation
 */

export interface Gene {
  attribute: string;
  value: number; // 0-100
  dominance: 'dominant' | 'recessive';
  mutation: number; // 0-1, mutation factor
}

export interface PlayerGenotype {
  speed: Gene[];
  strength: Gene[];
  agility: Gene[];
  stamina: Gene[];
  intelligence: Gene[];
  technique: Gene[];
}

export interface PlayerPhenotype {
  speed: number;
  strength: number;
  agility: number;
  stamina: number;
  intelligence: number;
  technique: number;
  healthRecovery: number;
}

export class GeneticsSystem {
  generatePlayerGenotype(
    parentGenotype1?: PlayerGenotype,
    parentGenotype2?: PlayerGenotype,
    mutationRate: number = 0.05
  ): PlayerGenotype {
    if (!parentGenotype1 || !parentGenotype2) {
      return this.generateRandomGenotype();
    }

    const speed = this.inheritGenes(parentGenotype1.speed, parentGenotype2.speed, mutationRate);
    const strength = this.inheritGenes(parentGenotype1.strength, parentGenotype2.strength, mutationRate);
    const agility = this.inheritGenes(parentGenotype1.agility, parentGenotype2.agility, mutationRate);
    const stamina = this.inheritGenes(parentGenotype1.stamina, parentGenotype2.stamina, mutationRate);
    const intelligence = this.inheritGenes(parentGenotype1.intelligence, parentGenotype2.intelligence, mutationRate);
    const technique = this.inheritGenes(parentGenotype1.technique, parentGenotype2.technique, mutationRate);

    return {
      speed,
      strength,
      agility,
      stamina,
      intelligence,
      technique,
    };
  }

  private inheritGenes(parent1: Gene[], parent2: Gene[], mutationRate: number): Gene[] {
    return parent1.map((gene1, idx) => {
      const gene2 = parent2[idx];
      const inherited = Math.random() < 0.5 ? gene1 : gene2;

      // Apply mutation
      if (Math.random() < mutationRate) {
        return {
          ...inherited,
          value: Math.max(0, Math.min(100, inherited.value + (Math.random() - 0.5) * 20)),
          mutation: inherited.mutation + 0.01,
        };
      }

      return inherited;
    });
  }

  private generateRandomGenotype(): PlayerGenotype {
    return {
      speed: this.generateRandomGenes(),
      strength: this.generateRandomGenes(),
      agility: this.generateRandomGenes(),
      stamina: this.generateRandomGenes(),
      intelligence: this.generateRandomGenes(),
      technique: this.generateRandomGenes(),
    };
  }

  private generateRandomGenes(): Gene[] {
    return [
      {
        attribute: 'base',
        value: Math.random() * 100,
        dominance: 'dominant',
        mutation: Math.random() * 0.1,
      },
      {
        attribute: 'modifier',
        value: Math.random() * 100,
        dominance: Math.random() < 0.5 ? 'dominant' : 'recessive',
        mutation: Math.random() * 0.1,
      },
    ];
  }

  phenotypeFromGenotype(genotype: PlayerGenotype, ageModifier: number = 1): PlayerPhenotype {
    return {
      speed: this.expressGenes(genotype.speed) * ageModifier,
      strength: this.expressGenes(genotype.strength) * ageModifier,
      agility: this.expressGenes(genotype.agility) * ageModifier,
      stamina: this.expressGenes(genotype.stamina) * ageModifier,
      intelligence: this.expressGenes(genotype.intelligence) * ageModifier,
      technique: this.expressGenes(genotype.technique) * ageModifier,
      healthRecovery: 0.5 + Math.random() * 0.5,
    };
  }

  private expressGenes(genes: Gene[]): number {
    let total = 0;

    for (const gene of genes) {
      if (gene.dominance === 'dominant') {
        total += gene.value * 0.7;
      } else {
        total += gene.value * 0.3;
      }
    }

    return Math.max(0, Math.min(100, total / genes.length));
  }

  calculateGeneticDistance(genotype1: PlayerGenotype, genotype2: PlayerGenotype): number {
    const attributes: (keyof PlayerGenotype)[] = [
      'speed',
      'strength',
      'agility',
      'stamina',
      'intelligence',
      'technique',
    ];

    let totalDistance = 0;

    for (const attr of attributes) {
      const val1 = this.expressGenes(genotype1[attr]);
      const val2 = this.expressGenes(genotype2[attr]);
      totalDistance += Math.abs(val1 - val2);
    }

    return totalDistance / attributes.length;
  }

  predictOffspringPotential(
    parentGenotype1: PlayerGenotype,
    parentGenotype2: PlayerGenotype
  ): {
    averagePotential: number;
    maxPotential: number;
    minPotential: number;
  } {
    let potentials: number[] = [];

    for (let i = 0; i < 100; i++) {
      const offspring = this.generatePlayerGenotype(parentGenotype1, parentGenotype2, 0.01);
      const phenotype = this.phenotypeFromGenotype(offspring);
      const overall = Object.values(phenotype).reduce((a, b) => a + b) / 7;
      potentials.push(overall);
    }

    return {
      averagePotential: potentials.reduce((a, b) => a + b) / potentials.length,
      maxPotential: Math.max(...potentials),
      minPotential: Math.min(...potentials),
    };
  }
}
